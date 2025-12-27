package com.epharma.ecosystem;

import org.springframework.boot.SpringApplication;

import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.ComponentScan;

@SpringBootApplication
@ComponentScan(basePackages = {"com.epharma.ecosystem"})
public class EpharmaApplication {

    public static void main(String[] args) {
        SpringApplication.run(EpharmaApplication.class, args);
    }
}
