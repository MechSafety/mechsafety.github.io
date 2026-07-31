---
title: Members
nav:
  order: 3
  tooltip: Our laboratory members
---

# {% include icon.html icon="fa-solid fa-users" %}Members

Meet the people in our laboratory.

{% assign members = site.members | sort: "order" %}

{% if members.size > 0 %}

{% include section.html %}

## Principal Investigator

<div class="member-list">
  {% for member in members %}
    {% if member.role == "principal-investigator" or member.role == "pi" %}
      {% include member-row.html member=member %}
    {% endif %}
  {% endfor %}
</div>

{% include section.html %}

## Researchers and Students

<div class="member-list">
  {% for member in members %}
    {% assign is_alumni = false %}
    {% if member.status == "alumni" or member.group == "alum" %}
      {% assign is_alumni = true %}
    {% endif %}
    {% unless member.role == "principal-investigator" or member.role == "pi" or is_alumni %}
      {% include member-row.html member=member %}
    {% endunless %}
  {% endfor %}
</div>

{% include section.html %}

## Alumni

<div class="member-list">
  {% for member in members %}
    {% if member.status == "alumni" or member.group == "alum" %}
      {% include member-row.html member=member %}
    {% endif %}
  {% endfor %}
</div>

{% else %}

Member profiles will be added here.

{% endif %}
