FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build

WORKDIR /src

COPY backend/ ./backend/

WORKDIR /src/backend

RUN dotnet restore OrderManagement.Api/OrderManagement.Api.csproj

RUN dotnet publish OrderManagement.Api/OrderManagement.Api.csproj \
    -c Release \
    -o /app/publish \
    /p:UseAppHost=false


FROM mcr.microsoft.com/dotnet/aspnet:9.0 AS final

WORKDIR /app

COPY --from=build /app/publish .

ENV ASPNETCORE_URLS=http://+:8080

EXPOSE 8080

ENTRYPOINT ["dotnet", "OrderManagement.Api.dll"]