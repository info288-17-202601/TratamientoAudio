import base64
import io

from flask import request, send_file
from sqlalchemy import select, func
from sqlalchemy.orm import selectinload, joinedload, defer

from webiste.app.extensions import db
from webiste.app.helpers.responses import error_response, success_response
from webiste.app.models.audio import Audio
from webiste.app.models.log_sample import LogSample

_MIME_TYPES = {
    "wav": "audio/wav",
    "mp3": "audio/mpeg",
    "ogg": "audio/ogg",
    "flac": "audio/flac",
    "aac": "audio/aac",
    "m4a": "audio/mp4",
    "webm": "audio/webm",
}


def _summary(audio: Audio, created_at=None) -> dict:
    loc = audio.location_ref
    return {
        "audio_id": str(audio.id),
        "audio_category": audio.audio_category,
        "decibels": audio.decibels,
        "duration": audio.duration,
        "avg_frecuency": audio.avg_frecuency,
        "latitud": loc.latitude if loc else None,
        "longitud": loc.longitude if loc else None,
        "weather": loc.weather if loc else None,
        "bird_name": [b.name for b in audio.birds][0] if audio.birds != [] else None,
        "created_at": created_at.isoformat() if created_at else None,
    }


def list_audios():
    category = request.args.get("category")

    earliest_ts = (
        select(LogSample.id_audio, func.min(LogSample.timestamp).label("ts"))
        .where(LogSample.id_audio.isnot(None))
        .group_by(LogSample.id_audio)
        .subquery()
    )

    stmt = (
        select(Audio, earliest_ts.c.ts)
        .outerjoin(earliest_ts, Audio.id == earliest_ts.c.id_audio)
        .options(
            defer(Audio.audio_file),
            selectinload(Audio.birds),
            joinedload(Audio.location_ref),
        )
    )

    if category:
        stmt = stmt.where(Audio.audio_category == category)

    rows = db.session.execute(stmt).all()
    return success_response([_summary(audio, ts) for audio, ts in rows])


def get_audio(audio_id: str):
    # Usar options en db.session.get para cargar las relaciones
    audio = db.session.get(
        Audio, 
        audio_id, 
        options=[selectinload(Audio.birds), joinedload(Audio.location_ref)]
    )
    
    if audio is None:
        return error_response("Audio no encontrado", 404)

    loc = audio.location_ref
    birds = [b.name for b in audio.birds]

    audio_b64 = None
    if audio.audio_file:
        audio_b64 = base64.b64encode(bytes(audio.audio_file)).decode("utf-8")

    return success_response({
        "audio_id": str(audio.id),
        "audio": audio_b64,
        "file_extension": audio.file_extension,
        "audio_category": audio.audio_category,
        "decibels": audio.decibels,
        "duration": audio.duration,
        "avg_frecuency": audio.avg_frecuency,
        "latitud": loc.latitude if loc else None,
        "longitud": loc.longitude if loc else None,
        "weather": loc.weather if loc else None,
        "birds": birds,
    })


def stream_audio(audio_id: str):
    audio = db.session.get(Audio, audio_id)
    if audio is None:
        return error_response("Audio no encontrado", 404)
    if not audio.audio_file:
        return error_response("Archivo de audio no disponible", 404)

    ext = (audio.file_extension or "wav").lstrip(".")
    mime = _MIME_TYPES.get(ext.lower(), f"audio/{ext}")

    return send_file(
        io.BytesIO(bytes(audio.audio_file)),
        mimetype=mime,
        as_attachment=False,
        download_name=f"{audio_id}.{ext}",
    )