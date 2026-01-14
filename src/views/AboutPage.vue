<script setup>
import SiteFooter from '@/components/SiteFooter.vue'
</script>

<template>
  <div class="about-container">
    <h1>About Spokane Taiko</h1>

    <section class="about-section">
      <h2>What We Do</h2>
      <p>
        Spokane Taiko is a non-profit organization that seeks to build community and create
        awareness through the traditional music and rhythms of Japan. Members experience a journey
        in building relationships, physical stamina, focus, and cooperation (just to name a few).
        These skills not only contribute to a fine-tuned kumi-daiko ensemble, but to a harmonious
        lifestyle even outside the group. The culture that surrounds the art of taiko is one that
        involves patience and discipline in every aspect of life.
      </p>
    </section>

    <section class="about-section">
      <h2>Our Story</h2>
      <p>
        Spokane Taiko was originally founded in October 1997 by Michiko Takaoka (Mukogawa Fort
        Wright Girls Institute) and Atsumi McCauley. In December 2010, Aaron Mark became the
        director until he retired in October of 2016.
      </p>
    </section>

    <section class="about-section">
      <h2>Glossary</h2>
      <p><strong>Bachi: </strong><span>Drumsticks</span></p>
      <p><strong>Chu-daiko: </strong><span>Medium-size drum</span></p>
      <p><strong>O-daiko: </strong><span>The big drum</span></p>
      <p>
        <strong>Shime-daiko: </strong>
        <span>Small drum with higher pitch like a snare, keeps time for the group by playing the ji</span>
      </p>
      <p>
        <strong>Ji: </strong>
        <span
          >Underlying pulse or beat that keeps time for the song, typically played by shime</span
        >
      </p>
      <p><strong>Hachimaki: </strong><span>Headband worn for performances</span></p>
      <p>
        <strong>Kiai: </strong>
        <span>
          A shout during a song for encouragement, to signify certain transitions,
          to add dynamics to the song, etc. Similar use in martial arts.
        </span>
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
  color: #42b983;
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
