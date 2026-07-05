import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const CurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user;
    return {
      userId: user?.sub || user?.userId,
      email: user?.email,
      role: user?.role,
      tenantId: user?.tenantId,
    };
  },
);
