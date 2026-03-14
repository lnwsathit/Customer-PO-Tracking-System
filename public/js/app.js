document.addEventListener('DOMContentLoaded', () => {
    if (window.jQuery && window.jQuery.fn.DataTable) {
        window.jQuery('.js-datatable').DataTable({
            pageLength: 10,
            ordering: true
        });
    }

    const chartDataSource = document.getElementById('customer-chart-data');
    let customerChartData = [];
    if (chartDataSource && chartDataSource.value) {
        try {
            customerChartData = JSON.parse(chartDataSource.value);
        } catch (error) {
            customerChartData = [];
        }
    }

    if (window.Chart && Array.isArray(customerChartData) && customerChartData.length) {
        const ctx = document.getElementById('customerChart');
        if (ctx) {
            const labels = customerChartData.map((item) => item.name);
            const values = customerChartData.map((item) => item.total);
            new Chart(ctx, {
                type: 'bar',
                data: {
                    labels,
                    datasets: [
                        {
                            label: 'Total PO',
                            data: values,
                            backgroundColor: '#0d6efd'
                        }
                    ]
                },
                options: {
                    responsive: true,
                    plugins: {
                        legend: { display: false }
                    }
                }
            });
        }
    }

    function bindRemoveButton(row, container) {
        const removeButton = row.querySelector('[data-remove-row]');
        if (!removeButton) {
            return;
        }

        removeButton.addEventListener('click', () => {
            const rows = container.querySelectorAll('[data-repeatable-row]');
            if (rows.length <= 1) {
                const inputs = row.querySelectorAll('input');
                inputs.forEach((input) => {
                    if (input.type === 'file') {
                        input.value = '';
                    } else {
                        input.value = '';
                    }
                });
                return;
            }

            row.remove();
        });
    }

    document.querySelectorAll('[data-repeatable-container]').forEach((container) => {
        container.querySelectorAll('[data-repeatable-row]').forEach((row) => bindRemoveButton(row, container));
    });

    document.querySelectorAll('[data-add-row]').forEach((button) => {
        button.addEventListener('click', () => {
            const key = button.getAttribute('data-add-row');
            const container = document.querySelector(`[data-repeatable-container="${key}"]`);
            if (!container) {
                return;
            }

            const firstRow = container.querySelector('[data-repeatable-row]');
            if (!firstRow) {
                return;
            }

            const cloned = firstRow.cloneNode(true);
            cloned.querySelectorAll('input').forEach((input) => {
                input.value = '';
            });

            bindRemoveButton(cloned, container);
            container.appendChild(cloned);
        });
    });

    function debounce(fn, wait) {
        let timeout = null;
        return (...args) => {
            clearTimeout(timeout);
            timeout = setTimeout(() => fn(...args), wait);
        };
    }

    document.querySelectorAll('[data-autocomplete-url]').forEach((input) => {
        const url = input.getAttribute('data-autocomplete-url');
        const targetId = input.getAttribute('data-autocomplete-target');
        const menuId = input.getAttribute('data-autocomplete-menu');
        const labelField = input.getAttribute('data-autocomplete-label') || 'name';

        const hiddenInput = document.getElementById(targetId);
        const menu = document.getElementById(menuId);

        if (!url || !hiddenInput || !menu) {
            return;
        }

        const renderMenu = (items) => {
            menu.innerHTML = '';
            if (!items.length) {
                menu.classList.add('d-none');
                return;
            }

            items.forEach((item) => {
                const button = document.createElement('button');
                button.type = 'button';
                button.className = 'list-group-item list-group-item-action';
                button.textContent = item[labelField] || '';
                button.addEventListener('click', () => {
                    input.value = item[labelField] || '';
                    hiddenInput.value = item.id || '';
                    menu.classList.add('d-none');
                });
                menu.appendChild(button);
            });

            menu.classList.remove('d-none');
        };

        const fetchAutocomplete = debounce(async () => {
            const keyword = input.value.trim();
            hiddenInput.value = '';

            if (keyword.length < 1) {
                renderMenu([]);
                return;
            }

            try {
                const response = await fetch(`${url}?q=${encodeURIComponent(keyword)}`);
                if (!response.ok) {
                    renderMenu([]);
                    return;
                }
                const items = await response.json();
                renderMenu(Array.isArray(items) ? items : []);
            } catch (error) {
                renderMenu([]);
            }
        }, 250);

        input.addEventListener('input', fetchAutocomplete);
        input.addEventListener('blur', () => {
            setTimeout(() => menu.classList.add('d-none'), 150);
        });
        input.addEventListener('focus', () => {
            if (menu.children.length) {
                menu.classList.remove('d-none');
            }
        });
    });

    document.querySelectorAll('[data-customer-po-check-url]').forEach((input) => {
        const url = input.getAttribute('data-customer-po-check-url');
        const feedbackId = input.getAttribute('data-customer-po-feedback');
        const feedback = feedbackId ? document.getElementById(feedbackId) : null;
        const form = input.closest('form');

        if (!url || !feedback || !form) {
            return;
        }

        const setValidationState = (message) => {
            const hasError = Boolean(message);
            input.classList.toggle('is-invalid', hasError);
            feedback.textContent = message || '';
            feedback.classList.toggle('d-none', !hasError);
            form.dataset.customerPoInvalid = hasError ? 'true' : 'false';
        };

        const checkAvailability = debounce(async () => {
            const value = input.value.trim();

            if (!value) {
                setValidationState('');
                return;
            }

            try {
                const response = await fetch(`${url}?customer_po_no=${encodeURIComponent(value)}`);
                if (!response.ok) {
                    setValidationState('');
                    return;
                }

                const result = await response.json();
                setValidationState(result.exists ? result.message || 'This Customer PO number already exists.' : '');
            } catch (error) {
                setValidationState('');
            }
        }, 250);

        input.addEventListener('input', checkAvailability);
        input.addEventListener('blur', checkAvailability);

        form.addEventListener('submit', async (event) => {
            const value = input.value.trim();
            if (!value) {
                return;
            }

            try {
                const response = await fetch(`${url}?customer_po_no=${encodeURIComponent(value)}`);
                if (!response.ok) {
                    return;
                }

                const result = await response.json();
                if (result.exists) {
                    event.preventDefault();
                    setValidationState(result.message || 'This Customer PO number already exists.');
                    input.focus();
                }
            } catch (error) {
                // Ignore network validation failures and fall back to server-side validation.
            }
        });
    });
});
