package com.epharma.ecosystem.config;

import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.boot.orm.jpa.EntityManagerFactoryBuilder;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;
import org.springframework.orm.jpa.JpaTransactionManager;
import org.springframework.orm.jpa.LocalContainerEntityManagerFactoryBean;
import org.springframework.transaction.PlatformTransactionManager;
import javax.sql.DataSource;
import java.util.Objects;

@Configuration
@EnableJpaRepositories(
    basePackages = "com.epharma.ecosystem.repository.driverapp",
    entityManagerFactoryRef = "driverAppEntityManagerFactory",
    transactionManagerRef = "driverAppTransactionManager"
)
public class DriverAppDbConfig {
    @Bean(name = "driverAppEntityManagerFactory")
    public LocalContainerEntityManagerFactoryBean driverAppEntityManagerFactory(
            EntityManagerFactoryBuilder builder,
            @Qualifier("driverAppDataSource") DataSource dataSource) {
        return builder.dataSource(dataSource)
                .packages("com.epharma.ecosystem.model.driverapp")
                .persistenceUnit("driverApp")
                .build();
    }

    @Bean(name = "driverAppTransactionManager")
    public PlatformTransactionManager driverAppTransactionManager(
            @Qualifier("driverAppEntityManagerFactory") LocalContainerEntityManagerFactoryBean driverAppEntityManagerFactory) {
        return new JpaTransactionManager(Objects.requireNonNull(driverAppEntityManagerFactory.getObject(),
                "EntityManagerFactory must not be null"));
    }
}
