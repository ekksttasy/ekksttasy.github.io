---
layout: default
title: projects
permalink: /projects/
---

<div class="page page-wide">
    <div class="page-head">
        <h1>projects</h1>
        <button type="button" class="clear-skills" disabled>clear selections</button>
    </div>

    <ul class="project-list">
    {%- for project in site.data.projects.projects %}
        <li class="project">
            <h2>{{ project.name }}</h2>
            {%- if project.desc %}
            <p>{{ project.desc }}</p>
            {%- endif %}
            {%- if project.skills.size > 0 %}
            <ul class="skills">
                {%- for skill in project.skills %}
                <li><button type="button" class="skill" aria-pressed="false" data-skill="{{ skill | escape }}">{{ skill }}</button></li>
                {%- endfor %}
            </ul>
            {%- endif %}
            {%- if project.src %}
            <a class="project-link" href="{{ project.src }}" target="_blank" rel="noopener">source</a>
            {%- endif %}
        </li>
    {%- endfor %}
    </ul>
</div>

<script defer src="{{ '/assets/js/projects.js' | relative_url }}?v={{ site.time | date: '%s' }}"></script>
