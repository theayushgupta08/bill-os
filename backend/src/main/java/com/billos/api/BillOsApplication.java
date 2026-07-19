package com.billos.api;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;

@SpringBootApplication
@EnableJpaAuditing(dateTimeProviderRef = "auditingDateTimeProvider")
public class BillOsApplication {

    public static void main(String[] args) {
        SpringApplication.run(BillOsApplication.class, args);
    }

    @org.springframework.context.annotation.Bean
    public org.springframework.data.auditing.DateTimeProvider auditingDateTimeProvider() {
        return () -> java.util.Optional.of(java.time.OffsetDateTime.now());
    }
}
