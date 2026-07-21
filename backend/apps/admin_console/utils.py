import sib_api_v3_sdk
from sib_api_v3_sdk.rest import ApiException
from django.conf import settings


def send_admin_invite_email(to_email, invite_link):
    configuration = sib_api_v3_sdk.Configuration()
    configuration.api_key["api-key"] = settings.BREVO_API_KEY

    api_instance = sib_api_v3_sdk.TransactionalEmailsApi(sib_api_v3_sdk.ApiClient(configuration))

    send_smtp_email = sib_api_v3_sdk.SendSmtpEmail(
        to=[{"email": to_email}],
        sender={"email": "dr@trimaxapharmacy.com", "name": "PayCam"},
        subject="You've been invited to PayCam Admin",
        html_content=f"""
        <h2>PayCam Admin invite</h2>
        <p>You've been invited to join the PayCam staff admin console.</p>
        <p><a href="{invite_link}">Accept the invite and set up your account</a></p>
        <p>This link expires in 24 hours. If you weren't expecting this, ignore this email.</p>
        """
    )

    try:
        api_instance.send_transac_email(send_smtp_email)
        return True
    except ApiException as e:
        print(f"Brevo email error: {e}")
        return False
