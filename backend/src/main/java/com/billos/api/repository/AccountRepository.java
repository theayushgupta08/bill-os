package com.billos.api.repository;

import com.billos.api.entity.Account;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface AccountRepository extends JpaRepository<Account, UUID> {
    boolean existsByParent_Id(UUID parentId);
}
