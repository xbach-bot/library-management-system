package com.library.repository;

import com.library.entity.BorrowRecord;
import com.library.entity.BorrowStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface BorrowRecordRepository extends JpaRepository<BorrowRecord, Long> {

    Page<BorrowRecord> findByUserId(Long userId, Pageable pageable);

    @Query("SELECT br FROM BorrowRecord br WHERE " +
           "(:status IS NULL OR br.status = :status) AND " +
           "(:keyword IS NULL OR LOWER(br.user.fullName) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
           "LOWER(br.user.email) LIKE LOWER(CONCAT('%', :keyword, '%')))")
    Page<BorrowRecord> searchAndFilterRecords(@Param("keyword") String keyword, @Param("status") BorrowStatus status, Pageable pageable);

    long countByStatus(BorrowStatus status);

    @Query("SELECT COUNT(br) FROM BorrowRecord br WHERE br.status = 'BORROWED' AND br.dueDate < :now")
    long countOverdueRecords(@Param("now") LocalDateTime now);

    @Query("SELECT br FROM BorrowRecord br WHERE br.status = 'BORROWED' AND br.dueDate < :now")
    List<BorrowRecord> findOverdueRecords(@Param("now") LocalDateTime now);

    @Query("SELECT bd.book, COUNT(bd.id) as borrowCount " +
           "FROM BorrowDetail bd " +
           "GROUP BY bd.book " +
           "ORDER BY borrowCount DESC")
    List<Object[]> findTopBorrowedBooks(Pageable pageable);

    @Query("SELECT MONTH(br.borrowDate) as month, YEAR(br.borrowDate) as year, COUNT(br.id) as count " +
           "FROM BorrowRecord br " +
           "WHERE br.borrowDate >= :startDate " +
           "GROUP BY YEAR(br.borrowDate), MONTH(br.borrowDate) " +
           "ORDER BY YEAR(br.borrowDate) ASC, MONTH(br.borrowDate) ASC")
    List<Object[]> getBorrowStatsByMonth(@Param("startDate") LocalDateTime startDate);
}
