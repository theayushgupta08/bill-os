package com.billos.api.config;

import io.github.bucket4j.distributed.proxy.ProxyManager;
import io.github.bucket4j.redis.lettuce.cas.LettuceBasedProxyManager;
import io.lettuce.core.RedisClient;
import io.lettuce.core.RedisURI;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.time.Duration;

@Configuration
public class RedisConfig {

    @Value("${spring.redis.host}")
    private String redisHost;

    @Value("${spring.redis.port}")
    private int redisPort;

    @Value("${spring.redis.password:}")
    private String redisPassword;

    @Bean
    public RedisClient redisClient() {
        RedisURI.Builder uriBuilder = RedisURI.builder()
                .withHost(redisHost)
                .withPort(redisPort);
        
        if (redisPassword != null && !redisPassword.isEmpty()) {
            uriBuilder.withPassword(redisPassword.toCharArray());
        }

        return RedisClient.create(uriBuilder.build());
    }

    @Bean
    public ProxyManager<byte[]> proxyManager(RedisClient redisClient) {
        io.github.bucket4j.distributed.proxy.ClientSideConfig clientSideConfig = io.github.bucket4j.distributed.proxy.ClientSideConfig.getDefault()
                .withExpirationAfterWriteStrategy(io.github.bucket4j.distributed.ExpirationAfterWriteStrategy.basedOnTimeForRefillingBucketUpToMax(Duration.ofSeconds(10)));

        return LettuceBasedProxyManager.builderFor(redisClient)
                .withClientSideConfig(clientSideConfig)
                .build();
    }
}
