package com.library.service.impl;

import com.library.dto.DashboardStatsDTO;
import com.library.entity.Book;
import com.library.entity.BorrowStatus;
import com.library.entity.Role;
import com.library.repository.BookRepository;
import com.library.repository.BorrowRecordRepository;
import com.library.repository.UserRepository;
import com.library.service.DashboardService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class DashboardServiceImpl implements DashboardService {

    private final BookRepository bookRepository;
    private final UserRepository userRepository;
    private final BorrowRecordRepository borrowRecordRepository;

    @Override
    public DashboardStatsDTO getDashboardStats() {
        LocalDateTime now = LocalDateTime.now();
        
        long totalBooks = bookRepository.count();
        long totalReaders = userRepository.countByRole(Role.READER);
        
        // Sách đang được mượn = đang mượn bình thường + đang mượn quá hạn
        long borrowedBooks = borrowRecordRepository.countByStatus(BorrowStatus.BORROWED) 
                + borrowRecordRepository.countByStatus(BorrowStatus.OVERDUE);
                
        long overdueBooks = borrowRecordRepository.countByStatus(BorrowStatus.OVERDUE);

        // Lấy top 10 sách mượn nhiều nhất
        List<Object[]> topBooksRaw = borrowRecordRepository.findTopBorrowedBooks(PageRequest.of(0, 10));
        List<DashboardStatsDTO.TopBookDTO> topBooks = topBooksRaw.stream()
                .map(row -> {
                    Book book = (Book) row[0];
                    Long count = (Long) row[1];
                    return DashboardStatsDTO.TopBookDTO.builder()
                            .bookId(book.getId())
                            .title(book.getTitle())
                            .author(book.getAuthor())
                            .borrowCount(count)
                            .build();
                })
                .collect(Collectors.toList());

        // Lấy thống kê mượn sách 6 tháng gần nhất để vẽ biểu đồ
        LocalDateTime sixMonthsAgo = now.minusMonths(5).withDayOfMonth(1).withHour(0).withMinute(0).withSecond(0);
        List<Object[]> monthlyStatsRaw = borrowRecordRepository.getBorrowStatsByMonth(sixMonthsAgo);
        List<DashboardStatsDTO.MonthlyStatDTO> monthlyStats = monthlyStatsRaw.stream()
                .map(row -> {
                    Integer month = (Integer) row[0];
                    Integer year = (Integer) row[1];
                    Long count = (Long) row[2];
                    return DashboardStatsDTO.MonthlyStatDTO.builder()
                            .label(month + "/" + year)
                            .count(count)
                            .build();
                })
                .collect(Collectors.toList());

        return DashboardStatsDTO.builder()
                .totalBooks(totalBooks)
                .totalReaders(totalReaders)
                .borrowedBooks(borrowedBooks)
                .overdueBooks(overdueBooks)
                .topBooks(topBooks)
                .monthlyStats(monthlyStats)
                .build();
    }
}
