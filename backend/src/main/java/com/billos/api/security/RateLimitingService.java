package com.billos.api.security;

import io.github.bucket4j.Bandwidth;
import io.github.bucket4j.Bucket;
import io.github.bucket4j.BucketConfiguration;
import io.github.bucket4j.distributed.proxy.ProxyManager;
import java.nio.charset.StandardCharsets;
import java.util.function.Supplier;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class RateLimitingService {

    private final ProxyManager<byte[]> proxyManager;

    public Bucket resolveBucket(String key, Bandwidth limit) {
        Supplier<BucketConfiguration> configSupplier =
                () -> BucketConfiguration.builder().addLimit(limit).build();
        return proxyManager.builder().build(key.getBytes(StandardCharsets.UTF_8), configSupplier);
    }
}
