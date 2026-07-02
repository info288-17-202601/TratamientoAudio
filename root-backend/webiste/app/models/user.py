from webiste.app.extensions import db

from .types import GUID, uuid_default


class User(db.Model):
    __tablename__ = "USER"

    id = db.Column(GUID(), primary_key=True, default=uuid_default)
    name = db.Column(db.String, nullable=False)
    username = db.Column(db.String, unique=True, nullable=False, index=True)
    email = db.Column(db.String, unique=True, nullable=True, index=True)
    password = db.Column(db.String, nullable=True)
    role = db.Column(db.String, nullable=False, default="user")
    supabase_user_id = db.Column(db.String, unique=True, nullable=True, index=True)

    devices = db.relationship("Device", back_populates="user")
    logins = db.relationship("Login", back_populates="user")

    def to_dict(self):
        return {
            "id": str(self.id),
            "name": self.name,
            "username": self.username,
            "email": self.email,
            "role": self.role,
            "supabase_user_id": self.supabase_user_id,
        }
