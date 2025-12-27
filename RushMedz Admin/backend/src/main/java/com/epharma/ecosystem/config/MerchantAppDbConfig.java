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
    basePackages = "com.epharma.ecosystem.repository.merchantapp",
    entityManagerFactoryRef = "merchantAppEntityManagerFactory",
    transactionManagerRef = "merchantAppTransactionManager"
)
public class MerchantAppDbConfig {
    @Bean(name = "merchantAppEntityManagerFactory")
    public LocalContainerEntityManagerFactoryBean merchantAppEntityManagerFactory(
            EntityManagerFactoryBuilder builder,
            @Qualifier("merchantAppDataSource") DataSource dataSource) {
        return builder.dataSource(dataSource)
                .packages("com.epharma.ecosystem.model.merchantapp")
                .persistenceUnit("merchantApp")
                .build();
    }

    @Bean(name = "merchantAppTransactionManager")
    public PlatformTransactionManager merchantAppTransactionManager(
            @Qualifier("merchantAppEntityManagerFactory") LocalContainerEntityManagerFactoryBean merchantAppEntityManagerFactory) {
        return new JpaTransactionManager(Objects.requireNonNull(merchantAppEntityManagerFactory.getObject(),
                "EntityManagerFactory must not be null"));
    }
}
