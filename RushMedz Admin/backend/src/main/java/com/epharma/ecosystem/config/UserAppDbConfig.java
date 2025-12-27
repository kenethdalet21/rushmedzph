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
    basePackages = "com.epharma.ecosystem.repository.userapp",
    entityManagerFactoryRef = "userAppEntityManagerFactory",
    transactionManagerRef = "userAppTransactionManager"
)
public class UserAppDbConfig {
    @Bean(name = "userAppEntityManagerFactory")
    public LocalContainerEntityManagerFactoryBean userAppEntityManagerFactory(
            EntityManagerFactoryBuilder builder,
            @Qualifier("userAppDataSource") DataSource dataSource) {
        return builder.dataSource(dataSource)
                .packages("com.epharma.ecosystem.model.userapp")
                .persistenceUnit("userApp")
                .build();
    }

    @Bean(name = "userAppTransactionManager")
    public PlatformTransactionManager userAppTransactionManager(
            @Qualifier("userAppEntityManagerFactory") LocalContainerEntityManagerFactoryBean userAppEntityManagerFactory) {
        return new JpaTransactionManager(Objects.requireNonNull(userAppEntityManagerFactory.getObject(),
                "EntityManagerFactory must not be null"));
    }
}
