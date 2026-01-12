<script setup>
const currentYear = new Date().getFullYear()

const socialLinks = {
  facebook: 'https://facebook.com/SpokaneTaiko',
  instagram: 'https://instagram.com/spokanetaiko',
  youtube: 'https://youtube.com/user/SpokaneTaiko'
}

const contactEmail = 'spokanetaiko@live.com'
</script>

<template>
  <footer class="site-footer">
    <div class="footer-content">
      <div class="footer-section">
        <h3>Contact Us</h3>
        <p>
          <a :href="`mailto:${contactEmail}`" class="email-link">
            {{ contactEmail }}
          </a>
        </p>
      </div>

      <div class="footer-section">
        <h3>Follow Us</h3>
        <div class="social-links">
          <a
            :href="socialLinks.facebook"
            target="_blank"
            rel="noopener noreferrer"
            class="social-link facebook"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path
                d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"
              />
            </svg>
            <span>Facebook</span>
          </a>

          <a
            :href="socialLinks.instagram"
            target="_blank"
            rel="noopener noreferrer"
            class="social-link instagram"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path
                d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"
              />
            </svg>
            <span>Instagram</span>
          </a>

          <a
            :href="socialLinks.youtube"
            target="_blank"
            rel="noopener noreferrer"
            class="social-link youtube"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path
                d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"
              />
            </svg>
            <span>YouTube</span>
          </a>
        </div>
      </div>

      <div class="footer-section">
        <h3>Spokane Taiko</h3>
        <p class="footer-description">
          A community-based taiko drumming group in Spokane, Washington
        </p>
      </div>
    </div>

    <div class="footer-bottom">
      <p>&copy; {{ currentYear }} Spokane Taiko. All rights reserved.</p>
    </div>
  </footer>
</template>

<style scoped>
.site-footer {
  background: #2c3e50;
  color: white;
  margin-top: 4rem;
}

.footer-content {
  max-width: 1200px;
  margin: 0 auto;
  padding: 3rem 2rem 2rem;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 2rem;
}

.footer-section h3 {
  color: #42b983;
  margin-bottom: 1rem;
  font-size: 1.1rem;
}

.footer-section p {
  color: #ecf0f1;
  line-height: 1.6;
}

.email-link {
  color: #42b983;
  text-decoration: none;
  font-weight: 500;
}

.email-link:hover {
  text-decoration: underline;
}

.social-links {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.social-link {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  color: #ecf0f1;
  text-decoration: none;
  padding: 0.5rem;
  border-radius: 4px;
  transition: all 0.2s;
}

.social-link:hover {
  background: rgba(255, 255, 255, 0.1);
  transform: translateX(5px);
}

.social-link svg {
  width: 24px;
  height: 24px;
  flex-shrink: 0;
}

.social-link.facebook:hover {
  color: #1877f2;
}

.social-link.instagram:hover {
  color: #e4405f;
}

.social-link.youtube:hover {
  color: #ff0000;
}

.footer-description {
  font-size: 0.95rem;
  color: #bdc3c7;
}

.footer-bottom {
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  padding: 1.5rem 2rem;
  text-align: center;
}

.footer-bottom p {
  color: #95a5a6;
  font-size: 0.9rem;
  margin: 0;
}

@media (max-width: 768px) {
  .footer-content {
    grid-template-columns: 1fr;
  }
}
</style>
