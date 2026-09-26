import { render, screen, userEvent } from '@testing-library/react-native';

import { RichText } from '../RichText';

describe('RichText', () => {
  it('sends the URL to the link handler when a link is pressed', async () => {
    const onPressLink = jest.fn();
    await render(
      <RichText
        onPressLink={onPressLink}
        segments={[
          { kind: 'text', text: 'Read ' },
          { kind: 'link', text: 'the story', url: 'https://example.com/story' },
        ]}
      />,
    );

    const user = userEvent.setup();
    await user.press(screen.getByRole('link'));

    expect(onPressLink).toHaveBeenCalledWith('https://example.com/story');
  });
});
