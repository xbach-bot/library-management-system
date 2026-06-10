package com.library.repository;

import com.library.entity.BorrowDetail;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface BorrowDetailRepository extends JpaRepository<BorrowDetail, Long> {
    List<BorrowDetail> findByBorrowRecordId(Long recordId);
}
