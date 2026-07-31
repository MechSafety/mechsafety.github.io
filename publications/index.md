---
title: Publications
nav:
  order: 4
  tooltip: Publications from our laboratory
---

# {% include icon.html icon="fa-solid fa-scroll" %}Publications

Publications from our laboratory will be collected here.

{% include section.html %}

{% if site.data.citations.size > 0 %}

{% include search-box.html %}
{% include search-info.html %}
{% include list.html data="citations" component="citation" style="rich" %}

{% else %}

The publication list is being prepared.

{% endif %}
