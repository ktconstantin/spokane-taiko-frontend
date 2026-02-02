<script setup>
import { ref } from 'vue'
import { useToast } from '@/composables/useToast'
import emailjs from '@emailjs/browser'

const { showToast } = useToast()

const formData = ref({
  fullName: '',
  phone: '',
  email: '',
  subject: '',
  message: '',
})

const loading = ref(false)
const honeypot = ref('')

emailjs.init(import.meta.env.VITE_EMAILJS_PUBLIC_KEY)

async function submitForm() {
  if (honeypot.value !== '') {
    return
  }

  // Validation
  if (
    !formData.value.fullName ||
    !formData.value.email ||
    !formData.value.subject ||
    !formData.value.message
  ) {
    showToast('Please fill in all required fields', 'error')
    return
  }

  loading.value = true

  try {
    await emailjs.send(
      import.meta.env.VITE_EMAILJS_SERVICE_ID,
      import.meta.env.VITE_EMAILJS_TEMPLATE_ID,
      {
        from_name: formData.value.fullName,
        from_email: formData.value.email,
        phone: formData.value.phone || 'Not provided',
        subject: formData.value.subject,
        message: formData.value.message,
      },
    )

    showToast('Message sent successfully!', 'success')
    resetForm()
  } catch (error) {
    console.error('Error sending message:', error)
    showToast('Failed to send message. Please try emailing us directly.', 'error')
  } finally {
    loading.value = false
  }
}

function resetForm() {
  formData.value = {
    fullName: '',
    phone: '',
    email: '',
    subject: '',
    message: '',
  }
}
</script>

<template>
  <div class="contact-page">
    <!-- Header Banner -->
    <div class="contact-banner">
      <h1>Get In Touch</h1>
      <h2>Book Spokane Taiko For An Event</h2>
      <p class="subtitle">
        Please see our requirements below under CONTACT US.
        <br /><br />
        To book us for a performance please include the <strong>PERFORMANCE DETAILS</strong> in the
        message box along with this <strong>FORM</strong>. <br /><br />
        Or email us the required details directly at spokanetaiko@live.com
      </p>
    </div>

    <!-- Main Content -->
    <div class="contact-content">
      <!-- Left Column -->
      <div class="contact-info">
        <!-- Phone Contact -->
        <div class="phone-contact">
          <svg
            class="phone-icon"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <path
              d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"
            />
          </svg>
          <span class="phone-link"> (509) 720-8715 </span>
        </div>

        <!-- Email Contact -->
        <div class="email-contact">
          <svg
            class="email-icon"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <rect x="3" y="5" width="18" height="14" rx="2" />
            <path d="m3 7 9 6 9-6" />
          </svg>
          <a href="mailto:spokanetaiko@live.com" class="email-link"> spokanetaiko@live.com </a>
        </div>

        <!-- Performance Details -->
        <div class="performance-details">
          <h3>Performance Details</h3>
          <ul>
            <li>Event Location</li>
            <li>Type of Audience</li>
            <li>Length of Performance</li>
            <li>Coverage if outside (rain or sun)</li>
            <li>Storage for drum bags & cases while on site</li>
            <li>Change & warm up room (close to washrooms)</li>
            <li>Parking for (approx.) 3-4 vehicles while on site</li>
            <li>Minimum stage/performance area: 30' x 20' *</li>
          </ul>
          <p class="footnote">
            *We may be able to make adjustments if your area is smaller. Please leave notes in the
            message section.
          </p>
        </div>
      </div>

      <!-- Right Column - Contact Form -->
      <div class="contact-form">
        <h3>Contact Form</h3>
        <form @submit.prevent="submitForm">
          <input
            v-model="honeypot"
            type="text"
            name="website"
            tabindex="-1"
            autocomplete="off"
            style="position: absolute; left: -9999px"
          />
          <div class="form-group">
            <label for="fullName">Full Name *</label>
            <input
              id="fullName"
              v-model="formData.fullName"
              type="text"
              required
              placeholder="Your full name"
            />
          </div>

          <div class="form-group">
            <label for="phone">Phone Number</label>
            <input id="phone" v-model="formData.phone" type="tel" placeholder="(555) 123-4567" />
          </div>

          <div class="form-group">
            <label for="email">Email Address *</label>
            <input
              id="email"
              v-model="formData.email"
              type="email"
              required
              placeholder="your.email@example.com"
            />
          </div>

          <div class="form-group">
            <label for="subject">Subject *</label>
            <input
              id="subject"
              v-model="formData.subject"
              type="text"
              required
              placeholder="e.g., Performance Booking Request"
            />
          </div>

          <div class="form-group">
            <label for="message">Message *</label>
            <textarea
              id="message"
              v-model="formData.message"
              rows="8"
              required
              placeholder="Please include performance details if booking..."
            ></textarea>
          </div>

          <button type="submit" :disabled="loading" class="submit-btn">
            {{ loading ? 'Sending...' : 'Send Message' }}
          </button>
        </form>
      </div>
    </div>
  </div>
</template>

<style scoped>
.contact-page {
  max-width: 1200px;
  margin: 0 auto;
}

.contact-banner {
  background: linear-gradient(135deg, var(--color-purple) 0%, #000000 100%);
  color: white;
  padding: 3rem 2rem;
  text-align: center;
  border-radius: 8px;
  margin-bottom: 3rem;
}

.contact-banner h1 {
  font-size: 2.5rem;
  margin: 0 0 0.5rem 0;
  font-weight: 700;
}

.contact-banner h2 {
  font-size: 1.5rem;
  margin: 0 0 1.5rem 0;
  font-weight: 500;
}

.subtitle {
  font-size: 1rem;
  line-height: 1.8;
  max-width: 800px;
  margin: 0 auto;
  opacity: 0.95;
}

.contact-content {
  display: grid;
  grid-template-columns: 1fr 2fr;
  gap: 3rem;
  padding: 0 2rem;
}

/* Left Column */
.contact-info {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

/* Phone Contact - same styling as email */
.phone-contact {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1.5rem;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.phone-icon {
  width: 32px;
  height: 32px;
  color: var(--color-purple);
  flex-shrink: 0;
}

.phone-link {
  color: #2c3e50;
  text-decoration: none;
  font-size: 1.1rem;
  font-weight: 500;
}

.email-contact {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1.5rem;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.email-icon {
  width: 32px;
  height: 32px;
  color: var(--color-purple);
  flex-shrink: 0;
}

.email-link {
  color: #2c3e50;
  text-decoration: none;
  font-size: 1.1rem;
  font-weight: 500;
  word-break: break-all;
}

.email-link:hover {
  color: var(--color-purple);
  text-decoration: underline;
}

.performance-details {
  background: white;
  padding: 2rem;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.performance-details h3 {
  color: #2c3e50;
  margin: 0 0 1rem 0;
  font-size: 1.3rem;
}

.performance-details ul {
  list-style: none;
  padding: 0;
  margin: 0;
}

.performance-details li {
  padding: 0.75rem 0;
  border-bottom: 1px solid #ecf0f1;
  color: #2c3e50;
  line-height: 1.5;
}

.performance-details li:last-child {
  border-bottom: none;
}

.performance-details li::before {
  content: '•';
  color: var(--color-purple);
  font-weight: bold;
  display: inline-block;
  width: 1em;
  margin-right: 0.5rem;
}

.footnote {
  font-size: 0.85rem;
  color: #7f8c8d;
  font-style: italic;
  margin: 0;
  padding-left: 0;
  line-height: 1.4;
}

/* Right Column - Form */
.contact-form {
  background: white;
  padding: 2rem;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.contact-form h3 {
  color: #2c3e50;
  margin: 0 0 1.5rem 0;
  font-size: 1.5rem;
}

.form-group {
  margin-bottom: 1.5rem;
}

label {
  display: block;
  margin-bottom: 0.5rem;
  color: #2c3e50;
  font-weight: 500;
}

input,
textarea {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1rem;
  font-family: inherit;
}

input:focus,
textarea:focus {
  outline: none;
  border-color: var(--color-purple);
}

textarea {
  resize: vertical;
}

.captcha {
  margin: 1.5rem 0;
  padding: 1rem;
  background: #f8f9fa;
  border-radius: 4px;
  border: 1px solid #ddd;
}

.captcha-label {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  cursor: pointer;
  font-weight: 500;
  color: #2c3e50;
}

.captcha-label input[type='checkbox'] {
  width: auto;
  cursor: pointer;
}

.submit-btn {
  width: 100%;
  padding: 1rem;
  background: #000000;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 1.1rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.3s;
}

.submit-btn:hover:not(:disabled) {
  background: var(--color-purple);
}

.submit-btn:disabled {
  background: #95a5a6;
  cursor: not-allowed;
}

/* Mobile Responsive */
@media (max-width: 768px) {
  .contact-banner {
    padding: 2rem 1rem;
  }

  .contact-banner h1 {
    font-size: 1.8rem;
  }

  .contact-banner h2 {
    font-size: 1.2rem;
  }

  .contact-content {
    grid-template-columns: 1fr;
    gap: 2rem;
    padding: 0 1rem;
  }

  .contact-form {
    padding: 1.5rem;
  }
}
</style>
