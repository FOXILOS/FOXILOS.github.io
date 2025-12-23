// Конфигурация
const CONFIG = {
    FORM_ENDPOINT: 'https://formcarry.com/s/6JoTk4H7keA',
    STORAGE_KEY: 'feedback_form_data',
    MODAL_STATE: 'feedback_modal_open'
};

// Элементы DOM
const elements = {
    openFormBtn: document.getElementById('openFormBtn'),
    feedbackModal: document.getElementById('feedbackModal'),
    closeModalBtn: document.getElementById('closeModalBtn'),
    cancelBtn: document.getElementById('cancelBtn'),
    feedbackForm: document.getElementById('feedbackForm'),
    messageContainer: document.getElementById('messageContainer')
};

// Состояние формы
let formState = {
    isSubmitting: false
};

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', function() {
    initializeForm();
    setupEventListeners();
    restoreFormData();
    
    // Проверяем, открыта ли форма при загрузке (например, при обновлении страницы)
    if (window.location.hash === '#feedback') {
        openModal();
    }
});

// Инициализация формы
function initializeForm() {
    // Валидация email
    const emailInput = document.getElementById('email');
    emailInput.addEventListener('blur', validateEmail);
    
    // Валидация телефона
    const phoneInput = document.getElementById('phone');
    phoneInput.addEventListener('input', formatPhoneNumber);
}

// Настройка обработчиков событий
function setupEventListeners() {
    // Открытие модального окна
    elements.openFormBtn.addEventListener('click', openModal);
    
    // Закрытие модального окна
    elements.closeModalBtn.addEventListener('click', closeModal);
    elements.cancelBtn.addEventListener('click', closeModal);
    
    // Закрытие по клику вне формы
    elements.feedbackModal.addEventListener('click', function(e) {
        if (e.target === elements.feedbackModal) {
            closeModal();
        }
    });
    
    // Обработка отправки формы
    elements.feedbackForm.addEventListener('submit', handleFormSubmit);
    
    // Сохранение данных формы при вводе
    elements.feedbackForm.addEventListener('input', debounce(saveFormData, 500));
    
    // Обработка нажатия кнопки "Назад" в браузере
    window.addEventListener('popstate', function(e) {
        if (window.location.hash !== '#feedback') {
            closeModal();
        }
    });
};

// Открытие модального окна
function openModal() {
    elements.feedbackModal.style.display = 'block';
    document.body.style.overflow = 'hidden';
    
    // Добавляем состояние в историю браузера
    if (window.location.hash !== '#feedback') {
        history.pushState({ modal: 'open' }, '', '#feedback');
    }
    
    // Фокусируемся на первом поле
    setTimeout(() => {
        document.getElementById('fullName').focus();
    }, 300);
}

// Закрытие модального окна
function closeModal() {
    elements.feedbackModal.style.display = 'none';
    document.body.style.overflow = 'auto';
    clearMessage();
    
    // Возвращаемся к предыдущему URL
    if (window.location.hash === '#feedback') {
        history.back();
    }
}

// Обработка отправки формы
async function handleFormSubmit(e) {
    e.preventDefault();
    
    if (formState.isSubmitting) return;
    
    // Валидация формы
    if (!validateForm()) {
        return;
    }
    
    formState.isSubmitting = true;
    
    // Получаем данные формы
    const formData = new FormData(elements.feedbackForm);
    const data = Object.fromEntries(formData.entries());
    
    try {
        // Отправляем данные на сервер
        const response = await fetch(CONFIG.FORM_ENDPOINT, {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data)
        });
        
        if (response.ok) {
            showMessage('Сообщение успешно отправлено!', 'success');
            clearForm();
            localStorage.removeItem(CONFIG.STORAGE_KEY);
            
            // Закрываем форму через 2 секунды
            setTimeout(() => {
                closeModal();
            }, 2000);
        } else {
            throw new Error('Ошибка при отправке формы');
        }
    } catch (error) {
        console.error('Ошибка:', error);
        showMessage('Произошла ошибка при отправке формы. Пожалуйста, попробуйте еще раз.', 'error');
    } finally {
        formState.isSubmitting = false;
    }
}

// Валидация формы
function validateForm() {
    const requiredFields = elements.feedbackForm.querySelectorAll('[required]');
    let isValid = true;
    
    requiredFields.forEach(field => {
        if (!field.value.trim()) {
            markFieldAsInvalid(field);
            isValid = false;
        } else {
            markFieldAsValid(field);
        }
    });
    
    // Дополнительная валидация email
    const emailField = document.getElementById('email');
    if (emailField.value && !validateEmailField(emailField.value)) {
        markFieldAsInvalid(emailField);
        isValid = false;
    }
    
    return isValid;
}

// Валидация email
function validateEmail() {
    const emailField = this;
    if (emailField.value && !validateEmailField(emailField.value)) {
        markFieldAsInvalid(emailField);
        showFieldMessage(emailField, 'Введите корректный email адрес');
    } else {
        markFieldAsValid(emailField);
        clearFieldMessage(emailField);
    }
}

// Валидация формата email
function validateEmailField(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// Форматирование номера телефона
function formatPhoneNumber() {
    let value = this.value.replace(/\D/g, '');
    
    if (value.length > 0) {
        value = '+7 (' + value;
        
        if (value.length > 7) {
            value = value.slice(0, 7) + ') ' + value.slice(7);
        }
        if (value.length > 12) {
            value = value.slice(0, 12) + '-' + value.slice(12);
        }
        if (value.length > 15) {
            value = value.slice(0, 15) + '-' + value.slice(15);
        }
        if (value.length > 18) {
            value = value.slice(0, 18);
        }
    }
    
    this.value = value;
}

// Пометить поле как невалидное
function markFieldAsInvalid(field) {
    field.style.borderColor = '#dc3545';
    field.style.boxShadow = '0 0 0 3px rgba(220, 53, 69, 0.1)';
}

// Пометить поле как валидное
function markFieldAsValid(field) {
    field.style.borderColor = '#28a745';
    field.style.boxShadow = '0 0 0 3px rgba(40, 167, 69, 0.1)';
}

// Показать сообщение для поля
function showFieldMessage(field, message) {
    let messageElement = field.parentNode.querySelector('.field-message');
    if (!messageElement) {
        messageElement = document.createElement('div');
        messageElement.className = 'field-message error';
        field.parentNode.appendChild(messageElement);
    }
    messageElement.textContent = message;
    messageElement.style.color = '#dc3545';
    messageElement.style.fontSize = '0.8rem';
    messageElement.style.marginTop = '5px';
}

// Очистить сообщение поля
function clearFieldMessage(field) {
    const messageElement = field.parentNode.querySelector('.field-message');
    if (messageElement) {
        messageElement.remove();
    }
}

// Показать общее сообщение
function showMessage(text, type) {
    clearMessage();
    
    const messageElement = document.createElement('div');
    messageElement.className = `message ${type}`;
    messageElement.textContent = text;
    
    elements.messageContainer.appendChild(messageElement);
    
    // Автоматически скрыть сообщение через 5 секунд
    if (type === 'success') {
        setTimeout(clearMessage, 5000);
    }
}

// Очистить сообщение
function clearMessage() {
    elements.messageContainer.innerHTML = '';
}

// Сохранение данных формы в LocalStorage
function saveFormData() {
    const formData = new FormData(elements.feedbackForm);
    const data = {};
    
    for (let [key, value] of formData.entries()) {
        data[key] = value;
    }
    
    localStorage.setItem(CONFIG.STORAGE_KEY, JSON.stringify(data));
}

// Восстановление данных формы из LocalStorage
function restoreFormData() {
    const savedData = localStorage.getItem(CONFIG.STORAGE_KEY);
    
    if (savedData) {
        try {
            const data = JSON.parse(savedData);
            
            Object.keys(data).forEach(key => {
                const field = elements.feedbackForm.querySelector(`[name="${key}"]`);
                if (field) {
                    field.value = data[key];
                }
            });
        } catch (error) {
            console.error('Ошибка при восстановлении данных:', error);
        }
    }
}

// Очистка формы
function clearForm() {
    elements.feedbackForm.reset();
}

// Функция для ограничения частоты вызовов
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Обработка клавиши Escape
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape' && elements.feedbackModal.style.display === 'block') {
        closeModal();
    }
});
