from supabase import Client, create_client


def _validate_supported_key(key: str, env_name: str) -> None:
    if key.startswith("sb_publishable_") or key.startswith("sb_secret_"):
        raise RuntimeError(
            f"{env_name} usa una key nueva de Supabase ({key.split('_', 2)[0]}_...). "
            "La version instalada de supabase-py requiere las API keys legacy JWT "
            "(anon/service_role), que empiezan con 'eyJ'."
        )


class SupabaseService:
    """Wrapper delgado sobre el cliente oficial de Supabase.

    Se inicializa con la URL y la KEY (anon o service_role) leídas desde
    la configuración de la app Flask. Mantiene el cliente en modo lazy
    para no crear la conexión hasta que se use.
    """

    def __init__(self, url=None, key=None, service_role_key=None):
        self.url = url
        self.key = key
        self.service_role_key = service_role_key
        self._client = None
        self._admin_client = None

    @property
    def client(self) -> Client:
        if not self.url or not self.key:
            raise RuntimeError(
                "SUPABASE_URL y SUPABASE_KEY o SUPABASE_SERVICE_ROLE_KEY deben estar configurados en el entorno"
            )
        _validate_supported_key(self.key, "SUPABASE_KEY")

        if self._client is None:
            self._client = create_client(self.url, self.key)
        return self._client

    @property
    def admin_client(self) -> Client:
        if not self.url or not self.service_role_key:
            raise RuntimeError(
                "SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY deben estar configurados en el entorno"
            )
        _validate_supported_key(self.service_role_key, "SUPABASE_SERVICE_ROLE_KEY")

        if self._admin_client is None:
            self._admin_client = create_client(self.url, self.service_role_key)
        return self._admin_client

    @property
    def has_admin_credentials(self) -> bool:
        return bool(self.url and self.service_role_key)

    # ------------------------------------------------------------------
    # Auth helpers
    # ------------------------------------------------------------------
    def sign_up(self, email: str, password: str, data: dict | None = None):
        """Registra un nuevo usuario en Supabase Auth.

        Retorna el objeto `response` de supabase-py del cual se puede leer
        `.user` y `.session`.
        """
        options = {}
        if data:
            options["data"] = data
        return self.client.auth.sign_up(
            {"email": email, "password": password, "options": options} if options
            else {"email": email, "password": password}
        )

    def create_user(self, email: str, password: str, data: dict | None = None):
        """Crea un usuario en Supabase Auth usando la Admin API.

        Requiere `SUPABASE_SERVICE_ROLE_KEY`. Confirma el email de inmediato
        para que el usuario pueda iniciar sesion desde el frontend despues del
        registro hecho por el backend.
        """
        payload = {
            "email": email,
            "password": password,
            "email_confirm": True,
        }
        if data:
            payload["user_metadata"] = data
        return self.admin_client.auth.admin.create_user(payload)

    def sign_in_with_password(self, email: str, password: str):
        """Inicia sesión con email + password y retorna el response de supabase."""
        return self.client.auth.sign_in_with_password(
            {"email": email, "password": password}
        )

    def get_user_from_token(self, token: str):
        """Resuelve un access_token de Supabase a su usuario."""
        return self.client.auth.get_user(token)

    def reset_password_for_email(self, email: str, redirect_to: str | None = None):
        """Envía email de recuperación de contraseña."""
        kwargs = {"email": email}
        if redirect_to:
            kwargs["options"] = {"redirect_to": redirect_to}
        return self.client.auth.reset_password_for_email(**kwargs)


def get_supabase_service(app) -> SupabaseService:
    """Construye un SupabaseService a partir de la config de una app Flask."""
    return SupabaseService(
        url=app.config.get("SUPABASE_URL"),
        key=app.config.get("SUPABASE_KEY") or app.config.get("SUPABASE_SERVICE_ROLE_KEY"),
        service_role_key=app.config.get("SUPABASE_SERVICE_ROLE_KEY"),
    )
