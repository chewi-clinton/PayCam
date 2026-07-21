from django.apps import AppConfig


class CommonConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "apps.common"
    label = "paycam_common"

    def ready(self):
        import apps.common.schema_extensions
