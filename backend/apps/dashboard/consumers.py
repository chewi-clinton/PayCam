import json
import logging
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from apps.paycam_auth.utils import decode_jwt
from apps.paycam_auth.models import User

logger = logging.getLogger(__name__)


def merchant_group_name(merchant_id):
    """
    Single source of truth for the channel group name a merchant's
    dashboard connection joins. Anything that wants to push an update
    to a merchant's open dashboard (approve/decline views, the expiry
    task, card/crypto views once those exist) imports this so the
    group name can never drift between sender and consumer.
    """
    return f"merchant_dashboard_{merchant_id}"


class MerchantDashboardConsumer(AsyncWebsocketConsumer):
    """
    WebSocket endpoint for the merchant dashboard (Next.js frontend).
    Connect with: wss://.../ws/dashboard/?token=<merchant JWT>

    Auth reuses the exact same JWT used for REST endpoints (apps.paycam_auth),
    including token_version revocation -- if the merchant logs out, the
    same token can no longer open a new connection.

    On connect, the merchant is added to a group scoped to their own
    user id, so they only ever receive updates for their own transactions.
    """

    async def connect(self):
        raw_query_string = self.scope["query_string"].decode()
        token = self._extract_token(raw_query_string)

        if not token:
            logger.info("WS connect rejected: no token provided")
            await self.close(code=4001)
            return

        user = await self._authenticate(token)
        if user is None:
            logger.info("WS connect rejected: invalid or expired token")
            await self.close(code=4001)
            return

        self.merchant_id = user.id
        self.group_name = merchant_group_name(self.merchant_id)

        await self.channel_layer.group_add(self.group_name, self.channel_name)
        await self.accept()
        logger.info(f"WS connected: merchant {self.merchant_id}")

    async def disconnect(self, close_code):
        if hasattr(self, "group_name"):
            await self.channel_layer.group_discard(self.group_name, self.channel_name)
            logger.info(f"WS disconnected: merchant {getattr(self, 'merchant_id', '?')}")

    async def receive(self, text_data=None, bytes_data=None):
        # Dashboard is receive-only from the server's perspective -- it
        # doesn't need to send anything after connecting. Any inbound
        # message is ignored rather than erroring, in case the frontend
        # sends a ping/heartbeat.
        pass

    async def transaction_update(self, event):
        """
        Handler name must match the 'type' key sent via group_send --
        Channels dispatches event['type']='transaction.update' to a
        method named transaction_update (dots become underscores).
        """
        await self.send(text_data=json.dumps(event["payload"]))

    @staticmethod
    def _extract_token(raw_query_string):
        for part in raw_query_string.split("&"):
            if part.startswith("token="):
                return part[len("token="):]
        return None

    @staticmethod
    @database_sync_to_async
    def _authenticate(token):
        payload = decode_jwt(token)
        if not payload:
            return None
        try:
            user = User.objects.get(id=payload["user_id"])
        except User.DoesNotExist:
            return None
        if user.token_version != payload.get("token_version"):
            return None
        return user
