# Stage 1: Build the application using Maven
FROM maven:3.9-eclipse-temurin-17 AS build
WORKDIR /app

# Copy pom.xml và tải các dependency trước để tận dụng cache của Docker
COPY pom.xml .
RUN mvn dependency:go-offline

# Copy source code và đóng gói file JAR
COPY src ./src
RUN mvn clean package -DskipTests

# Stage 2: Run the application using Eclipse Temurin JRE Alpine
FROM eclipse-temurin:17-jre-alpine
WORKDIR /app

# Copy file jar từ Stage 1
COPY --from=build /app/target/library-management-*.jar app.jar

# Mở cổng 8080 cho API
EXPOSE 8080

# Chạy ứng dụng
ENTRYPOINT ["java", "-jar", "app.jar"]
