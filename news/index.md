---
title: News
nav:
  order: 5
  tooltip: News and laboratory activities
---

# {% include icon.html icon="fa-regular fa-newspaper" %}News

Education, conferences, awards, research activities, and events from our laboratory.

{% include section.html %}

{% if site.posts.size > 0 %}

{% include search-box.html %}
{% include tags.html tags=site.tags %}
{% include search-info.html %}

{% capture news_cards %}
  {% for post in site.posts %}
    {% include news-card.html post=post %}
  {% endfor %}
{% endcapture %}

{% include grid.html content=news_cards %}

{% else %}

News and laboratory activities will be posted here.

{% endif %}
