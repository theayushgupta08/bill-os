package com.billos.api;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;

@SpringBootApplication
@EnableJpaAuditing
public class BillOsApplication {

    public static void main(String[] args) {
        SpringApplication.run(BillOsApplication.class, args);
    }
}
