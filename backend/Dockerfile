# ---------- Build stage ----------
FROM eclipse-temurin:17-jdk-jammy AS build
WORKDIR /app

# Leverage Docker layer caching for dependencies
COPY mvnw .
COPY .mvn .mvn
COPY pom.xml .
RUN chmod +x mvnw && ./mvnw -B dependency:go-offline

COPY src src
RUN ./mvnw -B clean package -DskipTests

# ---------- Runtime stage ----------
FROM eclipse-temurin:17-jre-jammy
WORKDIR /app

COPY --from=build /app/target/studyboard-backend.jar app.jar

# Render injects PORT at runtime; application.properties reads server.port=${PORT:8080}.
# EXPOSE is documentation only — Render ignores it and routes to $PORT directly.
EXPOSE 8080

# Use sh -c so the ${PORT} env var (if you choose to pass it as -D) is expanded;
# in practice Spring Boot reads PORT directly via application.properties, so a
# plain exec form works fine too.
ENTRYPOINT ["java", "-jar", "app.jar"]
