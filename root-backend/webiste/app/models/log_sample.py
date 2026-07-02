from webiste.app.extensions import db

from .types import GUID


class LogSample(db.Model):
    __tablename__ = "log_sample"

    id = db.Column(GUID(), primary_key=True)
    timestamp = db.Column(db.DateTime(timezone=True), nullable=False)
    id_audio = db.Column(GUID(), db.ForeignKey("AUDIOS.id"), nullable=True)
    id_user = db.Column(GUID(), nullable=True)
    id_device = db.Column(GUID(), nullable=True)
