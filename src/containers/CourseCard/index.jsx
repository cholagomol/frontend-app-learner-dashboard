import React from 'react';
import PropTypes from 'prop-types';

import { Card } from '@openedx/paragon';

import { useIsCollapsed } from './hooks';
import CourseCardBanners from './components/CourseCardBanners';
import CourseCardImage from './components/CourseCardImage';
import CourseCardMenu from './components/CourseCardMenu';
import CourseCardActions from './components/CourseCardActions';
import CourseCardDetails from './components/CourseCardDetails';
import CourseCardTitle from './components/CourseCardTitle';

import './CourseCard.scss';

export const CourseCard = ({
  cardId,
}) => {
  const isCollapsed = useIsCollapsed();
  const orientation = isCollapsed ? 'vertical' : 'horizontal';
  return (
    <div className="mb-4.5 course-card" id={cardId} data-testid="CourseCard">
      <Card orientation={orientation}>
        <div className="d-flex flex-column w-100">
          <div {...(!isCollapsed && { className: 'd-flex align-items-center' })}>
            <CourseCardImage cardId={cardId} orientation="horizontal" />
            <Card.Body className="d-flex flex-column flex-md-row align-items-md-center justify-content-md-between w-100 py-3 px-4">
              <div className="d-flex flex-column justify-content-center flex-grow-1 pr-md-4">
                <Card.Header
                  title={<CourseCardTitle cardId={cardId} />}
                  actions={<CourseCardMenu cardId={cardId} />}
                />
                <Card.Section className="pt-0">
                  <CourseCardDetails cardId={cardId} />
                </Card.Section>
              </div>
              <Card.Footer orientation={orientation} className="flex-shrink-0 mt-3 mt-md-0 border-0 p-0 bg-transparent">
                <CourseCardActions cardId={cardId} />
              </Card.Footer>
            </Card.Body>
          </div>
          <CourseCardBanners cardId={cardId} />
        </div>
      </Card>
    </div>
  );
};
CourseCard.propTypes = {
  cardId: PropTypes.string.isRequired,
};

export default CourseCard;
