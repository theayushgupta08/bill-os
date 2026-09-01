package com.billos.api.repository;

import com.billos.api.entity.CollectionQrCode;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface CollectionQrCodeRepository extends JpaRepository<CollectionQrCode, UUID> {
    List<CollectionQrCode> findByUserId(UUID userId);
}
