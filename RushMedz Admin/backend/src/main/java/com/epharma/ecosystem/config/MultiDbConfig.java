package com.epharma.ecosystem.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.boot.jdbc.DataSourceBuilder;
import org.springframework.transaction.annotation.EnableTransactionManagement;

import javax.sql.DataSource;

@Configuration
@EnableTransactionManagement
public class MultiDbConfig {
    @Bean(name = "adminAppDataSource")
    @ConfigurationProperties(prefix = "spring.datasource.adminapp")
    public DataSource adminAppDataSource() {
        return DataSourceBuilder.create().build();
    }

    @Bean(name = "doctorAppDataSource")
    @ConfigurationProperties(prefix = "spring.datasource.doctorapp")
    public DataSource doctorAppDataSource() {
        return DataSourceBuilder.create().build();
    }

    @Bean(name = "driverAppDataSource")
    @ConfigurationProperties(prefix = "spring.datasource.driverapp")
    public DataSource driverAppDataSource() {
        return DataSourceBuilder.create().build();
    }

    @Bean(name = "merchantAppDataSource")
    @ConfigurationProperties(prefix = "spring.datasource.merchantapp")
    public DataSource merchantAppDataSource() {
        return DataSourceBuilder.create().build();
    }

    @Bean(name = "userAppDataSource")
    @ConfigurationProperties(prefix = "spring.datasource.userapp")
    public DataSource userAppDataSource() {
        return DataSourceBuilder.create().build();
    }
}
