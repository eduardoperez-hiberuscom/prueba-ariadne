FROM maven:3.9.9-eclipse-temurin-8 AS build

WORKDIR /workspace

COPY pom.xml ./
COPY src ./src

RUN mvn -q -DskipTests package

FROM eclipse-temurin:8-jre-jammy

WORKDIR /app

ENV JAVA_OPTS=""
ENV SPRING_PROFILES_ACTIVE=docker

RUN mkdir -p /opt/expedientes-system/storage /var/log/expedientes

COPY --from=build /workspace/target/expedientes-administrativos-1.0.0-SNAPSHOT.war /app/expedientes-app.war

EXPOSE 8080

ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -jar /app/expedientes-app.war"]