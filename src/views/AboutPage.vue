<script setup>
import SiteFooter from '@/components/SiteFooter.vue'
</script>

<template>
  <div class="about-container">
    <h1>About Spokane Taiko</h1>

    <section class="about-section">
      <h2>Who We Are</h2>
      <p>
        <strong>Spokane Taiko</strong> is a vibrant drum and percussion ensemble dedicated to
        sharing and celebrating Japanese musical traditions. Founded in 1997, we are a nonprofit
        organization that helps members grow through the four pillars of
        <strong>respect, strength of spirit, strength of body, and technique.</strong> Through
        Taiko, we promote harmony, patience, and discipline in everyday life.
      </p>

      <p>
        Spokane Taiko began at the U.S. campus of <strong>Mukogawa Women's University</strong> in
        Spokane. When the group's leader returned to Japan, she entrusted the drums to member
        <strong>Aaron Mark</strong>, with the agreement that he continue the group. We remain deeply
        grateful to Mukogawa for this gift, which allows us to carry on teaching and performing
        Taiko in Spokane.
      </p>

      <p>
        Today, Spokane Taiko thrives with passionate members dedicated to preserving and advancing
        the art of <strong>kumi-daiko</strong> (ensemble drumming). We welcome everyone—regardless
        of background, identity, or experience—to join our community.
      </p>

      <p>
        Through performances and workshops, we honor Taiko's ancient roots while celebrating its
        energy as a living, evolving art form. Whether soulful and reflective or powerful and
        electric, our music always resonates with the spirit of Taiko.
      </p>
    </section>

    <SiteFooter />
  </div>
</template>

<style scoped>
.about-container {
  max-width: 900px;
  margin: 0 auto;
  padding: 2rem;
}

h1 {
  color: #2c3e50;
  margin-bottom: 2rem;
  font-size: 2.5rem;
}

.about-section {
  margin-bottom: 3rem;
}

.about-section h2 {
  color: var(--color-purple);
  margin-bottom: 1rem;
  font-size: 1.75rem;
}

.about-section p {
  color: #2c3e50;
  line-height: 1.8;
  font-size: 1.1rem;
  margin-bottom: 1rem;
}
</style>
