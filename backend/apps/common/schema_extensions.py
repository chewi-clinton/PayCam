from drf_spectacular.extensions import OpenApiAuthenticationExtension
from drf_spectacular.plumbing import build_bearer_security_scheme_object


class JWTAuthenticationExtension(OpenApiAuthenticationExtension):
    target_class = "apps.paycam_auth.authentication.JWTAuthentication"
    name = "JWTAuth"

    def get_security_definition(self, auto_schema):
        return build_bearer_security_scheme_object(
            header_name="Authorization",
            token_prefix="Bearer",
            bearer_format="JWT",
        )


class MobileAppJWTAuthenticationExtension(OpenApiAuthenticationExtension):
    target_class = "apps.mobile_app.authentication.MobileAppJWTAuthentication"
    name = "MobileJWTAuth"

    def get_security_definition(self, auto_schema):
        return build_bearer_security_scheme_object(
            header_name="Authorization",
            token_prefix="Bearer",
            bearer_format="JWT",
        )


class APIKeyAuthenticationExtension(OpenApiAuthenticationExtension):
    target_class = "apps.paycam_auth.api_key_authentication.APIKeyAuthentication"
    name = "APIKeyAuth"

    def get_security_definition(self, auto_schema):
        return build_bearer_security_scheme_object(
            header_name="Authorization",
            token_prefix="Bearer",
            bearer_format="sk_live_...",
        )
