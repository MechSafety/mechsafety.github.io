---
title: Home
nav:
  order: 1
  tooltip: Home
---

# Mechanical safety through simulation

We study mechanical safety using computational modeling and simulation.

{% include recruitment.html %}

{% include section.html %}

## Latest News

{% assign latest_posts = site.posts | slice: 0, 3 %}

{% if latest_posts.size > 0 %}

{% capture news_cards %}
  {% for post in latest_posts %}
    {% include news-card.html post=post %}
  {% endfor %}
{% endcapture %}

{% include grid.html content=news_cards %}

{% include button.html link="news" text="View all news" icon="fa-solid fa-arrow-right" flip=true style="bare" %}

{% else %}

News and laboratory activities will be posted here.

{% endif %}

{% include section.html %}

## Research

Our research focuses on the mechanics, modeling, and simulation methods needed to understand and improve the safety of mechanical systems.

{% include button.html link="research" text="Explore our research" icon="fa-solid fa-arrow-right" flip=true style="bare" %}
