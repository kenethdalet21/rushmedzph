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
    basePackages = "com.epharma.ecosystem.repository.doctorapp",
    entityManagerFactoryRef = "doctorAppEntityManagerFactory",
    transactionManagerRef = "doctorAppTransactionManager"
)
public class DoctorAppDbConfig {
    @Bean(name = "doctorAppEntityManagerFactory")
    public LocalContainerEntityManagerFactoryBean doctorAppEntityManagerFactory(
            EntityManagerFactoryBuilder builder,
            @Qualifier("doctorAppDataSource") DataSource dataSource) {
        return builder.dataSource(dataSource)
                .packages("com.epharma.ecosystem.model.doctorapp")
                .persistenceUnit("doctorApp")
                .build();
    }

    @Bean(name = "doctorAppTransactionManager")
    public PlatformTransactionManager doctorAppTransactionManager(
            @Qualifier("doctorAppEntityManagerFactory") LocalContainerEntityManagerFactoryBean doctorAppEntityManagerFactory) {
        return new JpaTransactionManager(Objects.requireNonNull(doctorAppEntityManagerFactory.getObject(),
                "EntityManagerFactory must not be null"));
    }
}
