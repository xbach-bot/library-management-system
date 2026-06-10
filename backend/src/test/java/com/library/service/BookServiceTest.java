package com.library.service;

import com.library.dto.BookDTO;
import com.library.entity.Book;
import com.library.entity.Category;
import com.library.exception.BadRequestException;
import com.library.exception.ResourceNotFoundException;
import com.library.repository.BookRepository;
import com.library.repository.CategoryRepository;
import com.library.service.impl.BookServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class BookServiceTest {

    @Mock
    private BookRepository bookRepository;

    @Mock
    private CategoryRepository categoryRepository;

    @InjectMocks
    private BookServiceImpl bookService;

    private Category category;
    private Book book;
    private BookDTO bookDTO;

    @BeforeEach
    void setUp() {
        category = Category.builder()
                .id(1L)
                .name("Công nghệ thông tin")
                .description("Sách IT")
                .build();

        book = Book.builder()
                .id(1L)
                .title("Clean Code")
                .author("Robert C. Martin")
                .isbn("978-0132350884")
                .publisher("Prentice Hall")
                .category(category)
                .quantity(10)
                .availableQuantity(10)
                .description("A Handbook of Agile Software Craftsmanship.")
                .coverImage("")
                .build();

        bookDTO = BookDTO.builder()
                .id(1L)
                .title("Clean Code")
                .author("Robert C. Martin")
                .isbn("978-0132350884")
                .publisher("Prentice Hall")
                .categoryId(1L)
                .quantity(10)
                .description("A Handbook of Agile Software Craftsmanship.")
                .build();
    }

    @Test
    void getBookById_Success() {
        when(bookRepository.findById(1L)).thenReturn(Optional.of(book));

        BookDTO foundBook = bookService.getBookById(1L);

        assertNotNull(foundBook);
        assertEquals("Clean Code", foundBook.getTitle());
        verify(bookRepository, times(1)).findById(1L);
    }

    @Test
    void getBookById_NotFound_ThrowsException() {
        when(bookRepository.findById(1L)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> bookService.getBookById(1L));
        verify(bookRepository, times(1)).findById(1L);
    }

    @Test
    void createBook_Success() {
        when(bookRepository.existsByIsbn(bookDTO.getIsbn())).thenReturn(false);
        when(categoryRepository.findById(bookDTO.getCategoryId())).thenReturn(Optional.of(category));
        when(bookRepository.save(any(Book.class))).thenReturn(book);

        BookDTO createdBook = bookService.createBook(bookDTO);

        assertNotNull(createdBook);
        assertEquals(bookDTO.getIsbn(), createdBook.getIsbn());
        verify(bookRepository, times(1)).save(any(Book.class));
    }

    @Test
    void createBook_DuplicateIsbn_ThrowsException() {
        when(bookRepository.existsByIsbn(bookDTO.getIsbn())).thenReturn(true);

        assertThrows(BadRequestException.class, () -> bookService.createBook(bookDTO));
        verify(bookRepository, never()).save(any(Book.class));
    }
}
