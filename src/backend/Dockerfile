#ten plik narazie nie jest niezbedny. uzywamy gotowego obrazu .net z sdk10 wiec wystarczy docker-compose
FROM mcr.microsoft.com/dotnet/sdk:10.0

COPY . /app/

WORKDIR /app

CMD ["dotnet","run","--project","krasnoludki"]
