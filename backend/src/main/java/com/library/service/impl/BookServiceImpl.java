package com.library.service.impl;

import com.library.dto.BookDTO;
import com.library.entity.Book;
import com.library.entity.Category;
import com.library.exception.BadRequestException;
import com.library.exception.ResourceNotFoundException;
import com.library.repository.BookRepository;
import com.library.repository.CategoryRepository;
import com.library.service.BookService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class BookServiceImpl implements BookService {

    private final BookRepository bookRepository;
    private final CategoryRepository categoryRepository;

    @Override
    public Page<BookDTO> getBooks(String keyword, Long categoryId, int page, int size, String sortBy, String sortDir) {
        Sort sort = sortDir.equalsIgnoreCase(Sort.Direction.ASC.name()) ? 
                Sort.by(sortBy).ascending() : Sort.by(sortBy).descending();
        Pageable pageable = PageRequest.of(page, size, sort);

        Page<Book> booksPage = bookRepository.searchAndFilterBooks(keyword, categoryId, pageable);
        return booksPage.map(this::convertToDTO);
    }

    @Override
    public BookDTO getBookById(Long id) {
        Book book = bookRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy sách với ID: " + id));
        return convertToDTO(book);
    }

    @Override
    @Transactional
    public BookDTO createBook(BookDTO bookDTO) {
        if (bookRepository.existsByIsbn(bookDTO.getIsbn())) {
            throw new BadRequestException("Mã ISBN này đã tồn tại trên hệ thống!");
        }

        Category category = categoryRepository.findById(bookDTO.getCategoryId())
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy thể loại sách với ID: " + bookDTO.getCategoryId()));

        Book book = convertToEntity(bookDTO, category);
        book.setAvailableQuantity(book.getQuantity()); // Khi tạo mới, số lượng sẵn có bằng tổng số lượng
        
        Book savedBook = bookRepository.save(book);
        return convertToDTO(savedBook);
    }

    @Override
    @Transactional
    public BookDTO updateBook(Long id, BookDTO bookDTO) {
        Book book = bookRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy sách với ID: " + id));

        if (bookRepository.existsByIsbnAndIdNot(bookDTO.getIsbn(), id)) {
            throw new BadRequestException("Mã ISBN này đã thuộc về cuốn sách khác!");
        }

        Category category = categoryRepository.findById(bookDTO.getCategoryId())
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy thể loại sách với ID: " + bookDTO.getCategoryId()));

        // Tính toán lại availableQuantity dựa trên chênh lệch số lượng mượn
        int borrowedQuantity = book.getQuantity() - book.getAvailableQuantity();
        int newQuantity = bookDTO.getQuantity();
        
        if (newQuantity < borrowedQuantity) {
            throw new BadRequestException("Số lượng sách mới không thể nhỏ hơn số lượng sách đang được mượn (" + borrowedQuantity + " cuốn)!");
        }

        book.setTitle(bookDTO.getTitle());
        book.setAuthor(bookDTO.getAuthor());
        book.setIsbn(bookDTO.getIsbn());
        book.setPublisher(bookDTO.getPublisher());
        book.setCategory(category);
        book.setQuantity(newQuantity);
        book.setAvailableQuantity(newQuantity - borrowedQuantity);
        book.setDescription(bookDTO.getDescription());
        if (bookDTO.getCoverImage() != null) {
            book.setCoverImage(bookDTO.getCoverImage());
        }

        Book updatedBook = bookRepository.save(book);
        return convertToDTO(updatedBook);
    }

    @Override
    @Transactional
    public void deleteBook(Long id) {
        Book book = bookRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy sách với ID: " + id));
        
        int borrowedQuantity = book.getQuantity() - book.getAvailableQuantity();
        if (borrowedQuantity > 0) {
            throw new BadRequestException("Không thể xóa sách đang được mượn!");
        }
        
        bookRepository.delete(book);
    }

    private BookDTO convertToDTO(Book book) {
        return BookDTO.builder()
                .id(book.getId())
                .title(book.getTitle())
                .author(book.getAuthor())
                .isbn(book.getIsbn())
                .publisher(book.getPublisher())
                .categoryId(book.getCategory().getId())
                .categoryName(book.getCategory().getName())
                .quantity(book.getQuantity())
                .availableQuantity(book.getAvailableQuantity())
                .description(book.getDescription())
                .coverImage(book.getCoverImage())
                .build();
    }

    private Book convertToEntity(BookDTO dto, Category category) {
        return Book.builder()
                .id(dto.getId())
                .title(dto.getTitle())
                .author(dto.getAuthor())
                .isbn(dto.getIsbn())
                .publisher(dto.getPublisher())
                .category(category)
                .quantity(dto.getQuantity())
                .availableQuantity(dto.getAvailableQuantity() != null ? dto.getAvailableQuantity() : dto.getQuantity())
                .description(dto.getDescription())
                .coverImage(dto.getCoverImage())
                .build();
    }
}
