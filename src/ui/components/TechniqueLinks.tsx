import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { hasLinks, techniqueLinks } from '../../core/chains';
import type { Library } from '../../core/library';
import { Icon } from '../graphics/icons';
import { itemPath } from '../routes';
import { Section } from './common';
import { TransitionList } from './TransitionLink';

/** A page gives each group its own section; a review card, already under one heading, uses small ones. */
function Group({ sections, title, children }: { sections: boolean; title: string; children: ReactNode }) {
  return sections ? (
    <Section title={title}>{children}</Section>
  ) : (
    <>
      <h3>{title}</h3>
      {children}
    </>
  );
}

/**
 * How a technique meets others in a roll: what to switch to when it is stopped, what defends it and what it
 * defends. Draws nothing for a technique with no links, which is every technique the user added.
 */
export function TechniqueLinks({ lib, id, sections = false }: { lib: Library; id: string; sections?: boolean }) {
  const links = techniqueLinks(lib, id);
  if (!hasLinks(links)) return null;
  return (
    <>
      {links.followUps.length > 0 && (
        <Group sections={sections} title="If they stop it, switch to">
          <ul className="transition-list">
            {links.followUps.map(({ technique, when }) => (
              <li key={technique.id}>
                <Link className="row-link" to={itemPath('transition', technique.id)}>
                  <span className="row-text">
                    <span className="row-name">{technique.name}</span>
                    <span className="row-meta">{when}</span>
                  </span>
                  <Icon name="chevron" />
                </Link>
              </li>
            ))}
          </ul>
        </Group>
      )}
      {links.defences.length > 0 && (
        <Group sections={sections} title="How it gets defended">
          <TransitionList transitions={links.defences} positionById={lib.positionById} direction="in" />
        </Group>
      )}
      {links.answers.length > 0 && (
        <Group sections={sections} title="What it defends">
          <TransitionList transitions={links.answers} positionById={lib.positionById} direction="in" />
        </Group>
      )}
    </>
  );
}
