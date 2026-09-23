package com.billos.api.repository;

import com.billos.api.entity.CollectionPayment;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface CollectionPaymentRepository extends JpaRepository<CollectionPayment, UUID> {}
