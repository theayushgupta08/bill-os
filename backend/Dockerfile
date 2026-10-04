# Stage 1: Build the application
FROM maven:3.9-eclipse-temurin-25-alpine AS builder
WORKDIR /app
COPY pom.xml .
# Download dependencies first to cache them
RUN mvn dependency:go-offline -B
COPY src ./src
# Build the application, skipping tests to speed up deployment
RUN mvn clean package -DskipTests

# Stage 2: Run the application
FROM eclipse-temurin:25-jre-alpine
WORKDIR /app
# Copy the built jar from the builder stage
COPY --from=builder /app/target/*.jar app.jar
# Expose the port (Render uses 10000 by default or whatever process.env.PORT provides, but 8080 is standard for Spring)
EXPOSE 8080
# Run the application
ENTRYPOINT ["java", "-jar", "app.jar"]
