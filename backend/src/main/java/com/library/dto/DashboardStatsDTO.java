package com.library.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class DashboardStatsDTO {
    private long totalBooks;
    private long totalReaders;
    private long borrowedBooks;
    private long overdueBooks;
    private List<TopBookDTO> topBooks;
    private List<MonthlyStatDTO> monthlyStats;

    @Data
    @AllArgsConstructor
    @NoArgsConstructor
    @Builder
    public static class TopBookDTO {
        private Long bookId;
        private String title;
        private String author;
        private long borrowCount;
    }

    @Data
    @AllArgsConstructor
    @NoArgsConstructor
    @Builder
    public static class MonthlyStatDTO {
        private String label; // "T1/2026", "T2/2026", v.v.
        private long count;
    }
}
