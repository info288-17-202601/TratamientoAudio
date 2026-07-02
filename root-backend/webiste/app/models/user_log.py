from sqlalchemy import func

from webiste.app.extensions import db

from .types import GUID, uuid_default


class UserLog(db.Model):
    __tablename__ = "USER_LOGS"

    id = db.Column(GUID(), primary_key=True, default=uuid_default)
    id_user = db.Column(GUID(), db.ForeignKey("USER.id"), nullable=True)
    # Denormalizado: conserva quién fue aunque el usuario se elimine después
    username = db.Column(db.String)
    action = db.Column(db.String, nullable=False)
    method = db.Column(db.String, nullable=False)
    path = db.Column(db.String, nullable=False)
    status_code = db.Column(db.Integer)
    ip = db.Column(db.String)
    user_agent = db.Column(db.String)
    detail = db.Column(db.Text)
    created_at = db.Column(db.DateTime(timezone=True), server_default=func.now(), nullable=False)

    def to_dict(self):
        return {
            "id": str(self.id),
            "id_user": str(self.id_user) if self.id_user else None,
            "username": self.username,
            "action": self.action,
            "method": self.method,
            "path": self.path,
            "status_code": self.status_code,
            "ip": self.ip,
            "user_agent": self.user_agent,
            "detail": self.detail,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }
