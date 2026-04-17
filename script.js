// Configuration constants
const PIXEL_ID = '1230047148487254';
const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwSaSkvHXzOlz-7N1eQQWW8Rt7k-dWSNoZrTmcZ0TMOUg7n6VGPDTyK66ed2eD1Uk6f/exec';

// Tailwind Configuration
if (window.tailwind) {
    tailwind.config = {
        theme: {
            extend: {
                colors: { mono: { bg: '#F9F9F9', black: '#0F0F0F', grey: '#6B6B6B' } },
                fontFamily: { sans: ['Manrope', 'sans-serif'], serif: ['Playfair Display', 'serif'] },
                animation: { 'fade-in': 'fadeIn 1s ease-out forwards' },
                keyframes: { fadeIn: { '0%': { opacity: '0', transform: 'translateY(10px)' }, '100%': { opacity: '1', transform: 'translateY(0)' } } }
            }
        }
    };
}

// Facebook Pixel Initialization
if (PIXEL_ID && PIXEL_ID !== 'YOUR_PIXEL_ID_HERE') {
    !function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window, document,'script','https://connect.facebook.net/en_US/fbevents.js');
    fbq('init', PIXEL_ID);
    fbq('track', 'PageView');
}

document.addEventListener('DOMContentLoaded', () => {
    // International Telephone Input Initialization
    const phoneInputField = document.querySelector("#phoneInput");
    let phoneInput;
    
    if (phoneInputField) {
        phoneInput = window.intlTelInput(phoneInputField, {
            initialCountry: "auto",
            geoIpLookup: function(callback) {
                fetch("https://ipapi.co/json")
                    .then(function(res) { return res.json(); })
                    .then(function(data) { callback(data.country_code); })
                    .catch(function() { callback("ua"); }); // Default to Ukraine
            },
            utilsScript: "https://cdnjs.cloudflare.com/ajax/libs/intl-tel-input/18.2.1/js/utils.js",
        });

        // Clear error on input
        phoneInputField.addEventListener('input', function() {
            this.classList.remove('input-error');
            const phoneError = document.getElementById('phoneError');
            if (phoneError) phoneError.style.display = 'none';
        });
    }

    // UTM Extraction
    function getUTMParameters() {
        const params = new URLSearchParams(window.location.search);
        return {
            utm_source: params.get('utm_source') || '',
            utm_medium: params.get('utm_medium') || '',
            utm_campaign: params.get('utm_campaign') || ''
        };
    }

    // Form Handling
    const form = document.getElementById('applicationForm');
    if (form) {
        const submitBtn = document.getElementById('submitBtn');
        const btnText = submitBtn.querySelector('span');
        const loader = submitBtn.querySelector('.loader');

        // Field Validation
        function validateTextField(inputElement, errorElementId, allowNumbers = false) {
            const errorElement = document.getElementById(errorElementId);
            const value = inputElement.value.trim();
            const hasNumbers = /\d/.test(value);
            
            if (value.length < 2 || (!allowNumbers && hasNumbers)) {
                inputElement.classList.add('input-error');
                if(errorElement) errorElement.style.display = 'block';
                return false;
            } else {
                inputElement.classList.remove('input-error');
                if(errorElement) errorElement.style.display = 'none';
                return true;
            }
        }

        // Live error removal
        const fields = [
            { id: 'nameInput', error: 'nameError' },
            { id: 'socialInput', error: 'socialError' },
            { id: 'nicheInput', error: 'nicheError' }
        ];

        fields.forEach(field => {
            const el = document.getElementById(field.id);
            if(el) {
                el.addEventListener('input', function() {
                    this.classList.remove('input-error');
                    const err = document.getElementById(field.error);
                    if(err) err.style.display = 'none';
                });
            }
        });

        // Submit Handler
        form.addEventListener('submit', function(e) {
            e.preventDefault();

            const isNameValid = validateTextField(document.getElementById('nameInput'), 'nameError', false);
            const isSocialValid = validateTextField(document.getElementById('socialInput'), 'socialError', true);
            const isNicheValid = validateTextField(document.getElementById('nicheInput'), 'nicheError', true);
            const isPhoneValid = phoneInput ? phoneInput.isValidNumber() : true;
            
            const phoneError = document.getElementById('phoneError');
            if (!isPhoneValid && phoneInputField) {
                phoneInputField.classList.add('input-error');
                if (phoneError) phoneError.style.display = 'block';
            }

            if (!isNameValid || !isSocialValid || !isNicheValid || !isPhoneValid) {
                return;
            }
            
            submitBtn.disabled = true;
            btnText.textContent = 'Відправка...';
            loader.style.display = 'block';

            const formData = new FormData(form);
            const data = Object.fromEntries(formData.entries());
            if (phoneInput) data.phone = phoneInput.getNumber(); 
            
            const utms = getUTMParameters();
            const finalData = { ...data, ...utms };

            fetch(GOOGLE_SCRIPT_URL, {
                method: 'POST',
                body: JSON.stringify(finalData),
                mode: 'no-cors' 
            })
            .then(() => {
                if (typeof fbq === 'function') fbq('track', 'Lead');
                showModal();
                form.reset();
            })
            .catch(error => {
                console.error('Error:', error);
                alert('Щось пішло не так.');
            })
            .finally(() => {
                submitBtn.disabled = false;
                btnText.textContent = 'Відправити анкету';
                loader.style.display = 'none';
            });
        });
    }

    // Modal Logic
    const modal = document.getElementById('successModal');
    const modalBackdrop = document.getElementById('modalBackdrop');
    const modalPanel = document.getElementById('modalPanel');

    window.showModal = function() {
        if (!modal) return;
        modal.classList.remove('hidden');
        document.body.classList.add('modal-open');
        setTimeout(() => {
            modalBackdrop.classList.remove('opacity-0');
            modalPanel.classList.remove('opacity-0', 'scale-95');
            modalPanel.classList.add('opacity-100', 'scale-100');
        }, 10);
    }

    window.closeModal = function() {
        if (!modal) return;
        modalBackdrop.classList.add('opacity-0');
        modalPanel.classList.remove('opacity-100', 'scale-100');
        modalPanel.classList.add('opacity-0', 'scale-95');
        setTimeout(() => {
            modal.classList.add('hidden');
            document.body.classList.remove('modal-open');
        }, 300);
    }

    // Notifications & Live Counter
    const names = ["Олена", "Марія", "Ірина", "Анастасія", "Тетяна", "Юлія", "Наталія", "Світлана", "Оксана", "Вікторія", "Дарина", "Анна", "Христина"];
    const actions = ["заповнила анкету", "забронювала місце", "щойно переглянула відео-урок", "хоче на курс"];
    
    function createToastContainer() {
        const toast = document.createElement('div');
        toast.id = 'notification-toast';
        toast.innerHTML = `
            <div class="pulse-dot"></div>
            <div class="text-[12px] text-gray-800 font-medium">
                <span id="toast-name" class="font-bold"></span> <span id="toast-action"></span>
            </div>
        `;
        document.body.appendChild(toast);
        return {
            el: toast,
            nameEl: toast.querySelector('#toast-name'),
            actionEl: toast.querySelector('#toast-action')
        };
    }

    const toastData = createToastContainer();

    function showNotification() {
        const randomName = names[Math.floor(Math.random() * names.length)];
        const randomAction = actions[Math.floor(Math.random() * actions.length)];
        
        toastData.nameEl.textContent = randomName;
        toastData.actionEl.textContent = randomAction;
        
        toastData.el.classList.add('show');
        
        setTimeout(() => {
            toastData.el.classList.remove('show');
        }, 4000);

        const nextTime = Math.floor(Math.random() * (25000 - 10000) + 10000);
        setTimeout(showNotification, nextTime);
    }

    // Live Counter
    const counterEl = document.getElementById('liveCounter');
    if (counterEl) {
        let currentCount = Math.floor(Math.random() * (10 - 4 + 1)) + 4;

        function updateCounter() {
            const change = Math.random() > 0.5 ? 1 : -1;
            currentCount += change;
            
            if (currentCount < 4) currentCount = 4;
            if (currentCount > 12) currentCount = 10;
            
            counterEl.style.opacity = '0';
            setTimeout(() => {
                counterEl.textContent = `Зараз заповнюють: ${currentCount} людей`;
                counterEl.style.opacity = '1';
            }, 500);

            const nextUpdate = Math.floor(Math.random() * (15000 - 5000) + 5000);
            setTimeout(updateCounter, nextUpdate);
        }
        updateCounter();
    }

    setTimeout(showNotification, 5000);
});
