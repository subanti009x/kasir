import { BadRequestException } from '@nestjs/common';
import { UserController } from './user.controller.js';
import type { UserService } from './user.service.js';

describe('UserController profile photo upload', () => {
  const updateMyAvatar = jest.fn();
  const userService = {
    updateMyAvatar,
  } as unknown as UserService;
  const controller = new UserController(userService);
  const user = { userId: 'user-1', tenantId: 'tenant-1' };

  beforeEach(() => updateMyAvatar.mockReset());

  it('accepts a valid image smaller than 1 MB and stores it on the current account', async () => {
    const file = {
      mimetype: 'image/jpeg',
      size: 512 * 1024,
      buffer: Buffer.from([0xff, 0xd8, 0xff, 0x00]),
    };
    updateMyAvatar.mockResolvedValue({ id: user.userId });

    await controller.uploadMyAvatar(file, user);

    expect(updateMyAvatar).toHaveBeenCalledWith(
      user.userId,
      user.tenantId,
      `data:image/jpeg;base64,${file.buffer.toString('base64')}`,
    );
  });

  it('rejects a file with an unsupported image type', () => {
    expect(() =>
      controller.uploadMyAvatar(
        {
          mimetype: 'image/svg+xml',
          size: 100,
          buffer: Buffer.from('<svg/>'),
        },
        user,
      ),
    ).toThrow(BadRequestException);
  });

  it('rejects image content that does not match its declared type', () => {
    expect(() =>
      controller.uploadMyAvatar(
        {
          mimetype: 'image/png',
          size: 100,
          buffer: Buffer.from('not a png'),
        },
        user,
      ),
    ).toThrow(BadRequestException);
  });
});
