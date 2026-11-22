---
layout: default
title: projects
permalink: /projects/
---

<div class="page page-wide">
    <h1>projects</h1>

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
                <li>{{ skill }}</li>
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