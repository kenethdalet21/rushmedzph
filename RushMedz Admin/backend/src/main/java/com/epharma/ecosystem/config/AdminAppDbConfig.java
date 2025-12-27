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
    basePackages = "com.epharma.ecosystem.repository.adminapp",
    entityManagerFactoryRef = "adminAppEntityManagerFactory",
    transactionManagerRef = "adminAppTransactionManager"
)
public class AdminAppDbConfig {
    @Bean(name = "adminAppEntityManagerFactory")
    public LocalContainerEntityManagerFactoryBean adminAppEntityManagerFactory(
            EntityManagerFactoryBuilder builder,
            @Qualifier("adminAppDataSource") DataSource dataSource) {
        return builder.dataSource(dataSource)
                .packages("com.epharma.ecosystem.model.adminapp")
                .persistenceUnit("adminApp")
                .build();
    }

    @Bean(name = "adminAppTransactionManager")
    public PlatformTransactionManager adminAppTransactionManager(
            @Qualifier("adminAppEntityManagerFactory") LocalContainerEntityManagerFactoryBean adminAppEntityManagerFactory) {
        return new JpaTransactionManager(Objects.requireNonNull(adminAppEntityManagerFactory.getObject(),
                "EntityManagerFactory must not be null"));
    }
}
