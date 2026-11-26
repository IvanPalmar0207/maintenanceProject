from pathlib import Path

from django.core.files.base import ContentFile
from django.core.files.storage import default_storage

from apps.core.models import StoredFile

origen = Path("/tmp/banner_6.jpg")
if origen.exists():
    destino = "noticias/portadas/banner_6.jpg"
    default_storage.save(destino, ContentFile(origen.read_bytes()))
    print("IMPORTADO:", destino)
else:
    print("ARCHIVO_LOCAL_NO_ENCONTRADO")

print("STOREDFILES_TOTAL:", StoredFile.objects.count())
for archivo in StoredFile.objects.all()[:10]:
    print("STOREDFILE|", archivo.name, archivo.size, archivo.content_type)
